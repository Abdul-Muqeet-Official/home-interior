import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import {
  getStoredTags,
  addTag,
  updateTag,
  removeTag,
} from "@/lib/content/tags-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const tags = getStoredTags();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const updated = addTag(name);
    return NextResponse.json({ tags: updated });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { oldName, newName } = body;
    if (!oldName || !newName) {
      return NextResponse.json({ error: "oldName and newName are required" }, { status: 400 });
    }

    const updated = updateTag(oldName, newName);
    return NextResponse.json({ tags: updated });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json().catch(() => ({}));
    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const updated = removeTag(name);
    return NextResponse.json({ tags: updated });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}

