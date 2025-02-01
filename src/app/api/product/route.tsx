
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse ,NextRequest} from "next/server";

const get_connect_with_db = async () => {
  try{
    const cookieStore =  cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    return { supabase };
  }
  catch(error){
    return NextResponse.json({ error: "Not able to connect with DB" }, { status: 405 });
  }
}
export async function POST(request: NextRequest) {
  try{
    const connection_response = await get_connect_with_db();
    const { supabase } :any= connection_response;
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requested_data = await request.json();
    const { id, name,description,unit_price } = requested_data;
    console.log(id, name,description,unit_price,requested_data,'request')
    if( !name || !description || !unit_price){
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if(id){ 
       const { error } = await supabase
          .from("products")
          .update({ id,name,description,unit_price, user_id: user.id })
          .eq("id", id);

        if(error){
          return NextResponse.json({ error: "Not able to update product" ,respnse_error: error}, { status: 405 });
        }

    }else{
      const { error } = await supabase
      .from("products")
      .insert([{ name,description,unit_price, user_id: user.id }]);

      if(error){
        return  NextResponse.json({  error: "Not able to create new product" ,respnse_error: error }, { status: 405 });
      }
    }

    
    return NextResponse.json({  message: "Data updated successfully" , }, { status: 200 });;
  }catch(error){
    return NextResponse.json({ error: "Not able to process current request" }, { status: 405 });
  }
}

export async function GET() {
  try{
    const connection_response = await get_connect_with_db();
    const { supabase }:any = connection_response;
    
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(products), { status: 200 });
  }catch(error){
    return NextResponse.json({ error: "Not able to process current request" }, { status: 405 });
  }
}