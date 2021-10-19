import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { server } from "../config";

const News = ({ news }) => {
  //   const [newsData, setNewsData] = useState(news.data);
  //   const [nextToken, setNextToken] = useState(news.meta.next_token);
  //   const [prevToken, setPrevToken] = useState("");

  //   const handleNext = async () => {
  //     const { data } = await axios.get(`${server}/api/news?pagination_token=${nextToken}`);
  //     setNewsData(data.data);
  //     setNextToken(data.meta.next_token);
  //     console.log(data);
  //   };

  //   const renderNews = () => {
  //     return newsData.map((news) => {
  //       return (
  //         <div
  //           key={news.id}
  //           className="w-full rounded-lg border-2 shadow-lg hover:shadow-md my-5 hover:bg-gray-100 cursor-pointer p-5"
  //         >
  //           {news.text}
  //         </div>
  //       );
  //     });
  //   };

  return (
    <div className="mt-28 md:mx-96 mx-10 font-pop text-gray-700">
      {/* {renderNews()} */}
      <a
        className="twitter-timeline"
        data-theme="light"
        href="https://twitter.com/GA4GH?ref_src=twsrc%5Etfw"
      >
        Loading
      </a>{" "}
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      {/* <div
        onClick={() => {
          handleNext();
        }}
      >
        Next
      </div> */}
    </div>
  );
};

export default News;
