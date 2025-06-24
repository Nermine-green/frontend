import Head from 'next/head';
import CsvDataTable from './CsvDataTable';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Home Page</title>
      </Head>
      <h1>Welcome to the Home Page</h1>
      <h2>CSV Data Table</h2>
      <CsvDataTable />
    </div>
  );
}