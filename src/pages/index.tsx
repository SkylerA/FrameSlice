import Head from "next/head";
import { Manrope } from "next/font/google";
//   Inter, Montserrat, Raleway, Quicksand, Manrope, Roboto, Lato, PT_Sans, Open_Sans

import styles from "@/styles/Home.module.css";
import VidCropper from "@/components/VidCropper";
import Link from "@mui/material/Link";

const font = Manrope({ subsets: ["latin"] });

export default function Home() {
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
        <div>
          <VidCropper></VidCropper>
        </div>
      </main>
    </>
  );
}
