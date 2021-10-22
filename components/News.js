import { TwitterTimelineEmbed } from "react-twitter-embed";

const News = () => {
  return (
    <div className="mt-28 md:mx-96 mx-10">
      <TwitterTimelineEmbed sourceType="profile" userId={2375288959} />
    </div>
  );
};

export default News;
