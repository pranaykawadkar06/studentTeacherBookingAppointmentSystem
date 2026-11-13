import { Link } from 'react-router-dom';

const Box = ({ code, title, text }) => (
  <div className="mx-auto max-w-md px-4 py-20 text-center">
    <p className="text-5xl font-bold text-indigo-600">{code}</p>
    <h1 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h1>
    <p className="mt-2 text-slate-600">{text}</p>
    <Link to="/" className="btn-primary mt-8">Back to home</Link>
  </div>
);

export const Unauthorized = () => <Box code="403" title="You can’t open this page" text="Your account doesn’t have permission to view it." />;
export const NotFound = () => <Box code="404" title="Page not found" text="The page you’re looking for doesn’t exist or has moved." />;
