import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Auth as Default Route (Root "/")
  index("./auth/authPages.tsx"),

  // Other routes
  route("chat", "./chat/messages.tsx"),
  route("home", "./routes/home.tsx"),        // optional

  // You can also add more auth sub-routes if needed
  // route("auth/login", "./auth/login.tsx"),
  // route("auth/register", "./auth/register.tsx"),
] satisfies RouteConfig;