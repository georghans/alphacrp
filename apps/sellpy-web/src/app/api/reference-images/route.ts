import { NextResponse } from "next/server";
import { uploadReferenceImage } from "@/lib/bucket";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const searchId = formData.get("searchId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const url = await uploadReferenceImage({
    file,
    keyPrefix: "reference-images",
    searchId: typeof searchId === "string" && searchId ? searchId : undefined
  });

  return NextResponse.json({ url });
}
