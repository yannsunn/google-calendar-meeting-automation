const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase接続設定
const supabaseUrl = 'https://dpqsipbppdemgfwuihjr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXNpcGJwcGRlbWdmd3VpaGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM3MjMzOSwiZXhwIjoyMDczOTQ4MzM5fQ.yFOaBW2xC_TvUzJEwD9V7VQD9A2t3hNRBrPYmrxOFqc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLFile() {
  try {
    console.log('📖 Reading SQL file...');
    const sqlPath = path.join(__dirname, '..', 'database', 'update-schema-for-enhanced-workflow.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // SQLをステートメントごとに分割（コメントと空行を除外）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '/*' && s !== '*/');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // コメントのみの行やマルチラインコメントをスキップ
      if (statement.match(/^\/\*[\s\S]*\*\/$/)) {
        continue;
      }

      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      console.log(`Preview: ${statement.substring(0, 60)}...`);

      try {
        const { data, error } = await supabase.rpc('exec', {
          sql: statement + ';'
        });

        if (error) {
          // RPC関数が存在しない場合は、直接実行を試みる
          if (error.message.includes('function public.exec')) {
            console.log('⚠️  RPC exec function not found. Trying direct query...');
            const { error: directError } = await supabase
              .from('_sql')
              .insert({ query: statement + ';' });

            if (directError) {
              console.error(`❌ Error: ${directError.message}`);
              errorCount++;
            } else {
              console.log('✅ Success');
              successCount++;
            }
          } else {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        errorCount++;
      }

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Execution Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Please check the errors above.');
      console.log('💡 Tip: You can also run the SQL file directly in Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/dpqsipbppdemgfwuihjr/sql/new');
    } else {
      console.log('\n✨ All statements executed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// 実行
executeSQLFile();
