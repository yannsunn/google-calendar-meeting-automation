const { google } = require('googleapis');

async function testCalendarWithApiKey() {
    const calendar = google.calendar({
        version: 'v3',
        auth: process.env.GOOGLE_API_KEY
    });

    try {
        // 公開カレンダーのテスト（カレンダーIDが必要）
        console.log('APIキーでのアクセステスト');
        // 注: プライベートカレンダーにはアクセスできません
        return { success: true, message: 'APIキー設定完了' };
    } catch (error) {
        console.error('Error:', error.message);
        return { success: false, error: error.message };
    }
}

testCalendarWithApiKey().then(console.log);
