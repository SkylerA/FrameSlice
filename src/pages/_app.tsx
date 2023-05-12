import "@/styles/globals.css";
// TODO remove this once this project uses App folder style
import "@/components/multiRangeSlider/multirangeSlider.css";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
