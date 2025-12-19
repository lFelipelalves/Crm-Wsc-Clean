import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env manually
const envPath = path.join(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    });
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const csvPath = path.join(process.cwd(), 'empresas.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('empresas.csv not found');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    const parseCSVLine = (line) => {
        const result = [];
        let start = 0;
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                let field = line.substring(start, i);
                if (field.startsWith('"') && field.endsWith('"')) {
                    field = field.substring(1, field.length - 1).replace(/""/g, '"');
                }
                result.push(field.trim());
                start = i + 1;
            }
        }
        let field = line.substring(start);
        if (field.startsWith('"') && field.endsWith('"')) {
            field = field.substring(1, field.length - 1).replace(/""/g, '"');
        }
        result.push(field.trim());
        return result;
    }

    // Estruturas para armazenar dados
    const empresasMap = new Map(); // codigo -> { razao_social, cnpj }
    const contatosArray = []; // { codigo, nome, telefone, cargo }

    console.log('Parsing CSV...');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cols = parseCSVLine(line);
        const codigo = cols[1];
        if (!codigo) continue;

        const razao_social = cols[2];
        const nome_contato = cols[3];
        const telefone = cols[4] ? cols[4].replace(/\D/g, "") : null;
        const cargo = cols[5] && cols[5].includes("SÓCIO") ? "Sócio/Responsável" : "Contato";
        const cnpj = cols[6];

        // Empresa única
        if (!empresasMap.has(codigo)) {
            empresasMap.set(codigo, { razao_social, cnpj });
        } else {
            // Atualizar CNPJ se não tiver ainda
            const existing = empresasMap.get(codigo);
            if (!existing.cnpj && cnpj) existing.cnpj = cnpj;
        }

        // Contato (cada linha é um contato)
        if (nome_contato) {
            contatosArray.push({ codigo, nome: nome_contato, telefone, cargo });
        }
    }

    const empresas = Array.from(empresasMap.entries()).map(([codigo, data]) => ({ codigo, ...data }));
    console.log(`Found ${empresas.length} unique companies and ${contatosArray.length} contacts.`);

    // Mapa para guardar codigo -> empresa_id (UUID do Supabase)
    const empresaIdMap = new Map();

    // --- PASSO 1: Inserir/Atualizar Empresas ---
    console.log('\n--- Importando Empresas ---');
    let empSuccess = 0, empErrors = 0;

    for (const [index, emp] of empresas.entries()) {
        if (index % 20 === 0) process.stdout.write(`Empresas: ${index + 1}/${empresas.length}\r`);

        try {
            const { data: existing } = await supabase
                .from("empresas")
                .select("id")
                .eq("codigo", emp.codigo)
                .maybeSingle();

            let empresaId;

            if (existing) {
                // Update
                empresaId = existing.id;
                const { error } = await supabase
                    .from("empresas")
                    .update({ razao_social: emp.razao_social, cnpj: emp.cnpj })
                    .eq("id", empresaId);
                if (error) throw error;
            } else {
                // Insert
                const { data, error } = await supabase
                    .from("empresas")
                    .insert({ codigo: emp.codigo, razao_social: emp.razao_social, cnpj: emp.cnpj, ativo: true })
                    .select('id')
                    .single();
                if (error) throw error;
                empresaId = data.id;
            }

            empresaIdMap.set(emp.codigo, empresaId);
            empSuccess++;
        } catch (e) {
            console.error(`\nErro empresa ${emp.codigo}:`, e.message);
            empErrors++;
        }
    }
    console.log(`\nEmpresas: ${empSuccess} OK, ${empErrors} erros.`);

    // --- PASSO 2: Limpar contatos antigos e inserir novos ---
    console.log('\n--- Importando Contatos ---');

    // Limpar contatos existentes para reimportar (evita duplicatas)
    console.log('Limpando contatos antigos...');
    await supabase.from("contatos").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Deleta tudo

    let contatoSuccess = 0, contatoErrors = 0;

    for (const [index, contato] of contatosArray.entries()) {
        if (index % 50 === 0) process.stdout.write(`Contatos: ${index + 1}/${contatosArray.length}\r`);

        const empresaId = empresaIdMap.get(contato.codigo);
        if (!empresaId) {
            console.error(`\nEmpresa não encontrada para código ${contato.codigo}`);
            contatoErrors++;
            continue;
        }

        try {
            const { error } = await supabase
                .from("contatos")
                .insert({
                    empresa_id: empresaId,
                    nome: contato.nome,
                    telefone: contato.telefone,
                    cargo: contato.cargo
                });
            if (error) throw error;
            contatoSuccess++;
        } catch (e) {
            console.error(`\nErro contato ${contato.nome}:`, e.message);
            contatoErrors++;
        }
    }

    console.log(`\nContatos: ${contatoSuccess} OK, ${contatoErrors} erros.`);
    console.log('\n✅ Importação finalizada!');
}

run();
