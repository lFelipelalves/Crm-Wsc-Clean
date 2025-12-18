import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const supabase = await createClient() // Client for auth check
        const adminSupabase = createAdminClient() // Admin client for actions

        // 1. Verify if requester is Admin
        const { data: { user: requester }, error: authError } = await supabase.auth.getUser()

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check role in DB
        const { data: requesterData } = await adminSupabase
            .from('usuarios')
            .select('role')
            .eq('auth_id', requester.id)
            .single()

        if (requesterData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
        }

        // 2. Parse body
        const { email, password, name, role } = await request.json()

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // 3. Create User in Supabase Auth
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: { name }
        })

        if (createError) {
            console.error("Auth Create Error:", createError)
            return NextResponse.json({ error: createError.message }, { status: 400 })
        }

        if (!newUser.user) {
            return NextResponse.json({ error: 'Failed to create user object' }, { status: 500 })
        }

        // 4. Insert into 'usuarios' table
        const { error: dbError } = await adminSupabase
            .from('usuarios')
            .insert({
                auth_id: newUser.user.id,
                email: email,
                nome: name,
                role: role,
                ativo: true
            })

        if (dbError) {
            // Rollback? Deleting auth user is tricky, but let's log it.
            console.error("DB Insert Error:", dbError)
            return NextResponse.json({ error: 'User created in Auth but failed in DB. Contact support.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: newUser.user })

    } catch (error) {
        console.error("Internal Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    // List users API? Or direct DB call?
    // Let's allow direct DB call from client for listing, protected by RLS
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
