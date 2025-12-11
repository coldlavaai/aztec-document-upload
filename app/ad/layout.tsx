import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work with Aztec Landscapes - Skilled Landscaper Jobs',
  description: 'Join Aztec Landscapes. We\'re hiring skilled landscapers and groundworkers in London. £170-£200/day, long-term work, CSCS required. Apply now via WhatsApp.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function AdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
