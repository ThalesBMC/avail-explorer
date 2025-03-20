import Link from "next/link";
import Image from "next/image";
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-2 justify-center mb-8">
        <Image
          src="/images/avail_logo.jpeg"
          alt="Avail Logo"
          width={64}
          height={64}
          className="rounded-full"
        />
        <h1 className="text-3xl font-bold mb-8 text-center">Avail Explorer</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/actions"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
        >
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <p className="text-gray-600">View and manage available actions</p>
        </Link>

        <Link
          href="/stats"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
        >
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <p className="text-gray-600">
            View network statistics and performance
          </p>
        </Link>
      </div>
    </div>
  );
}
