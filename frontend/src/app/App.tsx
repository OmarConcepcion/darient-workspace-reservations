import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { AppProviders } from "./providers";
import { appRoutes } from "./routes";

const router = createBrowserRouter(appRoutes);

export const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);
