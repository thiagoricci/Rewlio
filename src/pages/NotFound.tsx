import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Looks like you’ve followed a broken link or entered a URL that doesn’t exist on this site.
        </p>
        <p className="mb-8 text-muted-foreground">
          If this is your site, and you weren’t expecting a 404 for this path, please visit Netlify’s “page not found” support guide for troubleshooting tips.
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
