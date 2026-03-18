import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import connectDB from './mongodb';
import User from '@/models/User';
import { isVIPUser } from './vip-users';
import { ensureUserReferralCode, createWithReferralCode, lookupReferralCode } from './referral';
import { markLeadAsConverted } from './lead-conversion';
import { markReferralClicksAsConverted } from './referral-click-conversion';

export const authOptions: NextAuthConfig = {
  // Debug mode disabled - re-enable only when troubleshooting auth issues
  debug: false,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            // Silent fail - validation happens on frontend
            return null;
          }

          try {
            await connectDB();

            const user = await User.findOne({ email: credentials.email });

            if (!user) {
              // Silent fail - user will see message on frontend
              return null;
            }

            // Check if user has a password (not OAuth user)
            if (!user.password) {
              // Silent fail - user will see message on frontend
              return null;
            }

            // Validate password using bcrypt
            const isValidPassword = await (user as any).comparePassword(credentials.password);
            if (!isValidPassword) {
              // Silent fail - user will see message on frontend
              return null;
            }
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
            };
          } catch (error) {
            // Only log error message, not full stack trace
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Auth failed: ${errorMessage}`);
            return null; // Return null instead of throwing error
          }
        },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        await connectDB();

        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Check for pending referral code from signup flow
          let referredBy = undefined;
          let referredByInfluencer = undefined;
          let pendingReferralCode: string | undefined = undefined;
          
          try {
            const cookieStore = await cookies();
            const pendingReferral = cookieStore.get('pending_referral')?.value;
            
            if (pendingReferral) {
              pendingReferralCode = pendingReferral;
              const referrer = await lookupReferralCode(pendingReferral);
              if (referrer) {
                if (referrer.type === 'user') {
                  referredBy = referrer.id;
                } else {
                  referredByInfluencer = referrer.id;
                }
              }
              // Clear the pending referral cookie
              cookieStore.delete('pending_referral');
            }
          } catch (err) {
            console.error('Error processing referral code:', err);
          }
          
          // Check for fraud (create a mock request for fraud check)
          // Note: Google OAuth doesn't provide direct access to request object
          // We'll rely on email uniqueness check which is already enforced
          // For more sophisticated fraud detection, we'd need to store IP/device info during OAuth flow
          
          // VIP users get pro plan on signup, others get free
          const initialPlan = isVIPUser(user.email) ? 'pro' : 'free';
          // Create user with referral code, handling duplicate key errors
          existingUser = await createWithReferralCode(async (referralCode) => {
            return User.create({
              email: user.email,
              name: user.name || profile?.name || 'User',
              image: user.image,
              plan: initialPlan,
              referralCode,
              referredBy,
              referredByInfluencer,
            });
          });
          if (initialPlan === 'pro') {
            console.log(`VIP user ${user.email} created with pro plan`);
          }
          if (referredBy || referredByInfluencer) {
            console.log(`Google user ${user.email} signed up via referral`);
          }
          
          // Mark any leads as converted (fire-and-forget, don't block signup)
          markLeadAsConverted(existingUser.email, existingUser._id.toString(), existingUser.createdAt).catch(err => {
            console.error('Lead conversion tracking failed:', err);
          });

          // Mark referral clicks as converted if user signed up with a referral code (fire-and-forget)
          if (pendingReferralCode) {
            markReferralClicksAsConverted(pendingReferralCode, existingUser.createdAt).catch(err => {
              console.error('Referral click conversion tracking failed:', err);
            });
          }
        } else {
          // Ensure existing user has a referral code
          if (!existingUser.referralCode) {
            try {
              await ensureUserReferralCode(existingUser._id.toString());
            } catch (err) {
              console.error('Failed to generate referral code for existing user:', err);
            }
          }
          
          if (isVIPUser(user.email) && existingUser.plan === 'free') {
            // Upgrade existing VIP users from free to pro
            await User.findByIdAndUpdate(existingUser._id, { plan: 'pro' });
            console.log(`VIP user ${user.email} upgraded to pro plan`);
          } else if (!isVIPUser(user.email) && (existingUser.plan === 'pro' || existingUser.plan === 'standard') && !existingUser.stripeSubscriptionId) {
            // Downgrade non-VIP users who are on a paid plan but never paid (removed from VIP list)
            await User.findByIdAndUpdate(existingUser._id, { plan: 'free' });
            console.log(`Former VIP user ${user.email} downgraded to free plan (no Stripe subscription)`);
          }
        }

        user.id = existingUser._id.toString();
        return true;
      } else if (account?.provider === 'credentials') {
        // For credentials provider, if user is null, it means authentication failed
        if (!user) {
          return false; // Explicitly deny sign-in
        }
        
        // Handle VIP user plan changes and ensure referral code exists
        await connectDB();
        const dbUser = await User.findById(user.id);
        
        if (dbUser) {
          // Ensure existing user has a referral code
          if (!dbUser.referralCode) {
            try {
              await ensureUserReferralCode(user.id);
            } catch (err) {
              console.error('Failed to generate referral code for existing user:', err);
            }
          }
          
          if (user.email && isVIPUser(user.email) && dbUser.plan === 'free') {
            // Upgrade VIP users from free to pro
            await User.findByIdAndUpdate(user.id, { plan: 'pro' });
            console.log(`VIP user ${user.email} upgraded to pro plan`);
          } else if (user.email && !isVIPUser(user.email) && (dbUser.plan === 'pro' || dbUser.plan === 'standard') && !dbUser.stripeSubscriptionId) {
            // Downgrade non-VIP users who are on a paid plan but never paid (removed from VIP list)
            await User.findByIdAndUpdate(user.id, { plan: 'free' });
            console.log(`Former VIP user ${user.email} downgraded to free plan (no Stripe subscription)`);
          }
        }
        
        return true;
      }

      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.plan = user.plan || 'free';
        token.billingCycle = user.billingCycle || 'monthly';
        token.planLastUpdated = Date.now(); // Track when plan was last fetched
      }
      
      // Only fetch the latest plan from database if:
      // 1. We have a user ID
      // 2. Plan hasn't been updated in the last 5 minutes (300000ms) OR plan is not set
      const PLAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      const shouldRefreshPlan = !token.planLastUpdated || 
                                (Date.now() - token.planLastUpdated) > PLAN_CACHE_TTL;
      
      if (token.id && shouldRefreshPlan) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.plan = dbUser.plan || 'free';
            token.billingCycle = dbUser.billingCycle || 'monthly';
            token.referralCode = dbUser.referralCode || null;
            token.planLastUpdated = Date.now();
          }

          // Update lastActiveAt (throttled to once per hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          await User.updateOne(
            { _id: token.id, $or: [{ lastActiveAt: null }, { lastActiveAt: { $lt: oneHourAgo } }] },
            { $set: { lastActiveAt: new Date() } }
          );
        } catch (error) {
          // If DB query fails, use cached values - don't break auth
          console.error('Failed to refresh user plan from DB:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.plan = token.plan as string || 'free';
        session.user.billingCycle = token.billingCycle as string || 'monthly';
        session.user.referralCode = token.referralCode as string || null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Guard against invalid URL/baseUrl (can cause "Failed to construct 'URL': Invalid URL")
      let safeBase =
        baseUrl && typeof baseUrl === 'string' && baseUrl.startsWith('http')
          ? baseUrl
          : process.env.NEXTAUTH_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            'https://useakowe.com';
      safeBase = safeBase.replace(/\/$/, '');
      const candidate =
        url && typeof url === 'string' && url.trim() !== '' ? url : '/dashboard';

      // Normalize auth-path callbacks to prevent loops
      const normalize = (c: string) => {
        // Only allow same-origin relative paths
        if (c.startsWith('/') && !c.startsWith('//') && !c.includes('://')) {
          if (c.startsWith('/auth')) {
            return `${safeBase}/dashboard`;
          }
          return `${safeBase}${c}`;
        }

        // Absolute URL on same origin
        try {
          const urlObj = new URL(c);
          if (urlObj.origin === safeBase) {
            if (urlObj.pathname.startsWith('/auth')) {
              return `${safeBase}/dashboard`;
            }
            return c;
          }
        } catch {
          // fall through
        }

        return `${safeBase}/dashboard`;
      };

      return normalize(candidate);
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

