import Document, { Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <html>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="shortcut icon" href="/static/favicon.ico" type="image/x-icon" />
          <link rel="icon" href="/static/favicon.ico" type="image/x-icon" />
          <link rel="stylesheet" href="/static/css/main.css?v=4" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
