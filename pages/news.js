import { server } from "../config";
import axios from "axios";
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

// export const getStaticProps = async () => {
//   const { data } = await axios.get(`${server}/api/news`);

//   return {
//     props: {
//       news: data,
//     },
//     revalidate: 30,
//   };
// };

export default News;
