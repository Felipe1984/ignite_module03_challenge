import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface BannerData {
  width: number;
  height: number;
}

interface PostProps {
  post: Post;
  bannerData: BannerData;
}

export default function Post({ post, bannerData }: PostProps): JSX.Element {
  const router = useRouter();
  const [imgPxls, setImgPxls] = useState({ width: 1120, height: 400 });
  const sectionImgRef = useRef(null);
  useEffect(() => {
    if (sectionImgRef.current !== null) {
      setImgPxls({
        width: sectionImgRef.current.clientWidth,
        height: sectionImgRef.current.clientHeight,
      });
    } else if (bannerData) {
      setImgPxls({ ...bannerData });
    }
  }, [sectionImgRef, bannerData]);

  if (router.isFallback) {
    return (
      <main className={`${styles.postContainer} ${commonStyles.container}`}>
        <h1>Carregando...</h1>
      </main>
    );
  }

  const imageLink = post.data.banner.url;

  const { first_publication_date, data } = post;
  const postData = {
    first_publication_date: format(
      new Date(first_publication_date),
      'dd MMM y',
      {
        locale: ptBR,
      }
    ),
    title: data.title,
    author: data.author,
    banner: data.banner.url,
    content: data.content.map(contentItem => {
      const { heading, body } = contentItem;
      return {
        heading,
        body: RichText.asHtml(body),
      };
    }),
    readTime: `${Math.ceil(
      data.content.reduce((prevCount, contentItem) => {
        const bodyValue = RichText.asText(contentItem.body);
        const countItemHeading = contentItem.heading.split(/\s|\n/g).length;
        const countItemBody = bodyValue.split(/\s|\n/g).length;

        return prevCount + countItemHeading + countItemBody;
      }, 0) / 200
    )} min`,
  };

  // console.log(postData.content);

  return (
    <>
      <Head>
        <title>{router.query?.slug} | spacetraveling</title>
      </Head>
      <main className={`${styles.postContainer} ${commonStyles.container}`}>
        <section className={styles.postHeader}>
          <Header />
        </section>
        <section className={styles.postBanner} ref={sectionImgRef}>
          <Image
            src={imageLink}
            width={imgPxls.width}
            height={imgPxls.height}
          />
        </section>
        <section className={styles.postContent}>
          <h1>{postData.title}</h1>
          <span className={styles.postData}>
            <FiCalendar />
            {postData.first_publication_date}
          </span>
          <span className={styles.postData}>
            <FiUser />
            {postData.author}
          </span>
          <span className={styles.postData}>
            <FiClock />
            {postData.readTime}
          </span>
          {postData.content.map(contentItem => (
            <div key={contentItem.heading}>
              <h2>{contentItem.heading}</h2>

              <div
                dangerouslySetInnerHTML={{
                  __html: contentItem.body,
                }}
              />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 100,
    }
  );

  const postsPath = posts.results.map(postData => {
    return { params: { slug: postData.uid } };
  });

  return {
    paths: postsPath,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const {
    params: { slug },
  } = context;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', slug as string, {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  const bannerData: BannerData = {
    width: response.data.banner.dimensions?.width,
    height: response.data.banner.dimensions?.height,
  };

  // console.log(JSON.stringify(response, null, 2));
  // console.log(JSON.stringify(post, null, 2));
  return {
    props: {
      post,
      bannerData,
    },
  };
};
