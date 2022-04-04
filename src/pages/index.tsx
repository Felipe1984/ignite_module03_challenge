import { useState } from 'react';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FaRegCalendar, FaRegUser } from 'react-icons/fa';
import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handlePosts(): Promise<void> {
    const { next_page, results } = await fetch(nextPage).then(response =>
      response.json()
    );

    const morePosts: Post[] = await results.map(post => {
      const {
        uid,
        first_publication_date,
        data: { title, subtitle, author },
      } = post;

      return {
        uid,
        first_publication_date: format(
          new Date(first_publication_date),
          'dd MMM y',
          {
            locale: ptBR,
          }
        ),
        data: { title, subtitle, author },
      };
    });
    setPosts([...posts, ...morePosts]);
    setNextPage(next_page);
  }
  return (
    <main className={`${commonStyles.container} ${styles.container}`}>
      <Header />
      {posts.map(
        ({
          data: { author, subtitle, title },
          first_publication_date,
          uid,
        }) => (
          <section key={uid} className={styles.content}>
            <Link href={`/post/${uid}`}>
              <a>
                <h3>{title}</h3>
                <p>{subtitle}</p>
                <time>
                  <FaRegCalendar color="#BBBBBB" />
                  <span>{first_publication_date}</span>
                </time>
                <span>
                  <FaRegUser color="#BBBBBB" />
                  <span>{author}</span>
                </span>
              </a>
            </Link>
          </section>
        )
      )}

      {nextPage !== null && (
        <button
          type="button"
          className={styles.chargePost}
          onClick={handlePosts}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.author', 'post.subtitle'],
      pageSize: 2,
    }
  );

  // console.log(JSON.stringify(postsResponse, null, 2));
  const { next_page, results } = postsResponse;

  const posts: Post[] = results.map(post => {
    const {
      uid,
      first_publication_date,
      data: { title, subtitle, author },
    } = post;

    return {
      uid,
      first_publication_date: format(
        new Date(first_publication_date),
        'dd MMM y',
        {
          locale: ptBR,
        }
      ),
      data: { title, subtitle, author },
    };
  });

  const postsPagination: PostPagination = { next_page, results: posts };

  // console.log(JSON.stringify(postPagination, null, 2));

  return {
    props: {
      postsPagination,
    },
  };
};
