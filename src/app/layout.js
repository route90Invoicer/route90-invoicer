import "./globals.css";

export const metadata = {
  title: "Route90 Invoicer",
  description: "Invoicing for Route90 Trucking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
