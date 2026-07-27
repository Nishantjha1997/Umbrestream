import { syncHistory } from "@/actions/histories";
import { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type ResponseBody = UnifiedPlayerEventData & { completed?: boolean };

export const POST = async (request: Request) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You must be logged in" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ResponseBody;
    const res = await syncHistory(body, body.completed);

    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
};
