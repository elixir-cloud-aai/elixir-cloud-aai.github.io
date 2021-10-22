import Head from "next/head";
import NewsComponent from "../components/News";

const News = ({ news }) => {
  return (
    <div>
      <Head>
        <title>News</title>
      </Head>
      <NewsComponent news={news}></NewsComponent>
    </div>
  );
};

export default News;
