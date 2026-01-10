import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from './mongodb';
import User from '@/models/User';
import { isVIPUser } from './vip-users';
import { ensureUserReferralCode, createWithReferralCode } from './referral';

export const authOptions: NextAuthConfig = {
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
            console.log('Auth: Missing email or password');
            return null; // Return null instead of throwing error
          }

          try {
            await connectDB();

            const user = await User.findOne({ email: credentials.email });

            if (!user) {
              console.log('Auth: User not found for email:', credentials.email);
              return null; // Return null instead of throwing error
            }

            // Check if user has a password (not OAuth user)
            if (!user.password) {
              console.log('Auth: User has no password (Google OAuth user)');
              return null; // Return null instead of throwing error
            }

            // Validate password using bcrypt
            const isValidPassword = await (user as any).comparePassword(credentials.password);
            if (!isValidPassword) {
              console.log('Auth: Invalid password for user:', credentials.email);
              return null; // Return null instead of throwing error
            }
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
            };
          } catch (error) {
            console.error('Auth: Error during authentication:', error);
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
            });
          });
          if (initialPlan === 'pro') {
            console.log(`VIP user ${user.email} created with pro plan`);
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
          } else if (!isVIPUser(user.email) && existingUser.plan === 'pro' && !existingUser.stripeSubscriptionId) {
            // Downgrade non-VIP users who are on pro but never paid (removed from VIP list)
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
          } else if (user.email && !isVIPUser(user.email) && dbUser.plan === 'pro' && !dbUser.stripeSubscriptionId) {
            // Downgrade non-VIP users who are on pro but never paid (removed from VIP list)
            await User.findByIdAndUpdate(user.id, { plan: 'free' });
            console.log(`Former VIP user ${user.email} downgraded to free plan (no Stripe subscription)`);
          }
        }
        
        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.plan = user.plan || 'free';
        token.billingCycle = user.billingCycle || 'monthly';
      }
      
      // Always fetch the latest plan from the database when we have a user ID
      if (token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.plan = dbUser.plan || 'free';
          token.billingCycle = dbUser.billingCycle || 'monthly';
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
      }
      return session;
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

