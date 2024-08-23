/**
 * This file contains templates for special files that are generated by the compiler.
 */
export const DEFAULT_404_PAGE = `
export default function NotFound() {
   return <div>
   <h1>404 - Page Not Found</h1>
   </div>;
}        
`;

export const DEFAULT_ERROR_PAGE = `
export default function Error() {
   return <div>
    <h1>Something went wrong</h1>
    </div>;
   }        
`;

export const DEFAULT_PAGE = `
export default function Page() {
   return <div>
   <h1>Hello, welcome</h1>
   </div>;
}        
`;