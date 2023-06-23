import Head from "next/head";
import React from "react";
import styles from "@/styles/Layout.module.css";
import Link from "@mui/material/Link";

import { Manrope } from "next/font/google";
import { ParseSettingsContextProvider } from "./contexts/parseSettingsContext";
//   Inter, Montserrat, Raleway, Quicksand, Manrope, Roboto, Lato, PT_Sans, Open_Sans
const font = Manrope({ subsets: ["latin"] });

type Props = {
  children: React.ReactNode;
};

const Layout = (props: Props) => {
  return (
    <>
      <Head>
        <title>FrameSlice</title>
        <meta
          name="description"
          content="An easy way of cropping images from video, done client-side (in-browser) with the power of ffmpeg.wasm"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header>
        <h1 className={font.className}>FrameSlice</h1>
        <span>
          <em>
            <Link
              rel="noopener"
              target="_blank"
              color="#fff"
              href="https://ffmpegwasm.netlify.app/"
            >
              FFmpeg.wasm
            </Link>
            &nbsp;powered, in-browser video croppping
          </em>
        </span>
      </header>
      <main className={`${styles.main} ${font.className}`}>
        <ParseSettingsContextProvider>
          {props.children}
        </ParseSettingsContextProvider>
      </main>
    </>
  );
};

export default Layout;
