import { redirect } from "next/navigation";
import { getDefaultState } from "@/lib/states/registry";

export default function RootPage() {
  redirect(`/${getDefaultState()}`);
}
