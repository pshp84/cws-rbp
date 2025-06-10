import { sendApiEmailToUser } from '@/CommonComponent/SendEmailToUser';
import { addAffiliate, updateUser, userRoles } from '@/DbClient';
import { generateReferralCode, generateReferralLink } from '@/Helper/referrals';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PropertyManagerAPIFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userStatus?: boolean;
  phoneNumber: number;
  emailOptIn?: boolean,
  phoneNumberOptIn?: boolean
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 🛡️ Get the user's session from the request headers
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ message: 'Invalid token or session expired' }, { status: 401 });
    }

    // Check user's role
    const { user: { id: adminUserID } } = user;
    const { data: userRoleData, error: userRoleError } = await supabase.from('users')
      .select('user_role')
      .eq('user_id', adminUserID);
    if (userRoleError) return NextResponse.json({ message: 'Forbidden: You are not authorized to perform this action' }, { status: 403 });
    if (!userRoleData[0].user_role || userRoleData[0].user_role != "admin") return NextResponse.json({ message: 'Forbidden: You are not authorized to perform this action' }, { status: 403 });
    // EOF Check user's role

    const body: PropertyManagerAPIFormData = await request.json();

    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { firstName, lastName, email, password, userStatus = true, phoneNumber, emailOptIn, phoneNumberOptIn } = body;

    // 🛡️ Use the admin client to create a new property manager user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          email_opt_in: emailOptIn || false,
          phone_number_opt_in: phoneNumberOptIn || false
        },
        redirectTo: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/sign-in?success=1`,
      },
    });

    if (error) {
      return NextResponse.json({ message: 'Unable to create Property Manager user', error }, { status: 400 });
    }

    const { properties, user: propertyManagerUser } = data;

    if (!propertyManagerUser.id || !properties.action_link) {
      return NextResponse.json({ message: 'Unable to create Property Manager user', error }, { status: 400 });
    }

    await updateUser(propertyManagerUser.id, { userRole: userRoles.PropertyManager, userStatus });

    // Generate referral code for propertyManagerUser
    const newReferralCode = await generateReferralCode(firstName, lastName);
    if (!newReferralCode) {
      return NextResponse.json({ message: 'Unable to generate referral code for Property Manager user', error }, { status: 400 });
    }
    const affiliateData = await addAffiliate({ referralCode: newReferralCode, userID: propertyManagerUser.id });
    if (typeof affiliateData === 'boolean') {
      return NextResponse.json({ message: 'Unable to generate Affiliate profile for Property Manager user', error }, { status: 400 });
    }
    // EOF Generate referral code for propertyManagerUser

    // Send Welcome email to propertyManagerUser
    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
      siteURL,
      userName: firstName,
      userEmail: email,
      referralCode: newReferralCode,
      referralLink: generateReferralLink(newReferralCode),
      confirmEmailAddressLink: properties.action_link
    };

    await sendApiEmailToUser({
      sendTo: email,
      subject: `Welcome to RBP Club Affiliate Program - Confirm Your Email & Get Started!`,
      template: "propertyManagerUserWelcomeEmail",
      context: emailTemplateData,
      extension: ".html", dirpath: "public/email-templates"
    });
    // EOF send Welcome email to propertyManagerUser

    return NextResponse.json({ message: 'User created successfully', data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
  }
}
