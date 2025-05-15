import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {Providers} from "../providers/provider";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
            {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
