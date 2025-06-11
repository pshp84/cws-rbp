import "../../src/index.scss";
import NoSsr from "@/utils/NoSsr";
import MainProvider from "./MainProvider";
import { I18nProvider } from "./i18n/i18n-context";
import { detectLanguage } from "./i18n/server";
import SessionWrapper from "@/CommonComponent/SessionWrapper";
import { authoption } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { ToastContainer } from "react-toastify";
import { Metadata } from 'next';
import Error403Container from "@/Components/Other/Error/Error403";

export const metadata: Metadata = {
  title: 'Renters Benefit Package | Save Money & Build Credit',
  description: 'Discover the Renters Benefit Package (RBP): Save on essentials, build credit with rent payments, and enjoy exclusive perks for renters. Simplify your life!',
  metadataBase: new URL('https://members.rentersbp.com'),
  openGraph: {
    url: 'https://members.rentersbp.com/sign-up',
    type: 'website',
    title: 'Renters Benefit Package | Save Money & Build Credit',
    description: 'Discover the Renters Benefit Package (RBP): Save on essentials, build credit with rent payments, and enjoy exclusive perks for renters. Simplify your life!',
    images: [
      {
        url: '/assets/images/home/SocialImage.png',
        width: 1050,
        height: 550,
      },
    ],
  },
  twitter: {
    card: 'summary',
    //domain: 'members.rentersbp.com',
    title: 'Renters Benefit Package | Save Money & Build Credit',
    description: 'Discover the Renters Benefit Package (RBP): Save on essentials, build credit with rent payments, and enjoy exclusive perks for renters. Simplify your life!',
    images: [
      '/assets/images/home/SocialImage.png',
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lng = await detectLanguage();
  const session = await getServerSession(authoption);
  console.log("session",session)
  const tokenizationURL = process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_URL;

  if (!session) {
  // Maybe redirect, or show an auth error
  return <Error403Container />; 
}

  return (
    <I18nProvider language={lng}>
      <html>
        <head>
          <link
            rel="icon"
            href="/assets/images/rbpsitefavicon.png"
            type="image/png"
          />
          <link
            rel="shortcut icon"
            href="/assets/images/rbpsitefavicon.png"
            type="image/png"
          />
          <title>RBP Club</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Sora:wght@100..800&display=swap" rel="stylesheet" />
          <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAjeJEPREBQFvAIqDSZliF0WjQrCld-Mh0"></script>
          <script src={tokenizationURL}></script>
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        </head>
        <body suppressHydrationWarning={true}>
          <NoSsr>
            <SessionWrapper session={session}>
              <MainProvider>{children}</MainProvider>
              <ToastContainer />
            </SessionWrapper>
          </NoSsr>
        </body>
      </html>
    </I18nProvider>
  );
}