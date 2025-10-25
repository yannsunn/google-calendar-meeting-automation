/**
 * DX提案スライド自動生成システム
 * N8Nからのリクエストを受け取り、Googleスライドを生成
 */

// Webアプリのエンドポイント（POST リクエスト）
function doPost(e) {
  try {
    // UTF-8として明示的にデコード
    const requestBody = e.postData.contents;
    const data = JSON.parse(requestBody);

    // slideDataとメタ情報を取得
    const slideData = data.slideData || [];
    const companyName = data.companyName || '企業名不明';
    const presentationTitle = data.presentationTitle || `${companyName} 様 DX推進提案`;

    // デバッグ: ログに文字コードを出力
    Logger.log('Company Name: ' + companyName);
    Logger.log('Company Name charCode[0]: ' + (companyName.length > 0 ? companyName.charCodeAt(0) : 'empty'));

    // プレゼンテーションを作成
    const presentation = SlidesApp.create(presentationTitle);
    const presentationId = presentation.getId();

    // デフォルトの空白スライドを削除
    const slides = presentation.getSlides();
    if (slides.length > 0) {
      slides[0].remove();
    }

    // slideDataからスライドを生成
    let slideCount = 0;
    slideData.forEach((slideObj, index) => {
      try {
        createSlideFromData(presentation, slideObj, index);
        slideCount++;
      } catch (error) {
        console.error(`Error creating slide ${index}:`, error);
      }
    });

    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      presentationId: presentationId,
      slideUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      slideCount: slideCount,
      message: 'Slides generated successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: 'Failed to generate slides'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// テスト用GETエンドポイント
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    message: 'DX Proposal Slide Generator API is running',
    version: '1.0.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * slideDataオブジェクトから実際のスライドを生成
 */
function createSlideFromData(presentation, slideObj, index) {
  const type = slideObj.type;

  // タイプ別にスライドを生成
  switch(type) {
    case 'title':
      createTitleSlide(presentation, slideObj);
      break;
    case 'section':
      createSectionSlide(presentation, slideObj);
      break;
    case 'agenda':
      createAgendaSlide(presentation, slideObj);
      break;
    case 'content':
      createContentSlide(presentation, slideObj);
      break;
    case 'compare':
      createCompareSlide(presentation, slideObj);
      break;
    case 'process':
    case 'processList':
      createProcessSlide(presentation, slideObj);
      break;
    case 'headerCards':
      createHeaderCardsSlide(presentation, slideObj);
      break;
    case 'bulletCards':
      createBulletCardsSlide(presentation, slideObj);
      break;
    case 'kpi':
      createKpiSlide(presentation, slideObj);
      break;
    case 'statsCompare':
    case 'barCompare':
      createStatsCompareSlide(presentation, slideObj);
      break;
    case 'closing':
      createClosingSlide(presentation, slideObj);
      break;
    default:
      // デフォルトはシンプルなテキストスライド
      createDefaultSlide(presentation, slideObj);
  }
}

/**
 * タイトルスライド
 */
function createTitleSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  const shapes = slide.getShapes();

  shapes.forEach(shape => {
    const placeholderType = shape.getPlaceholderType();
    if (placeholderType === SlidesApp.PlaceholderType.TITLE ||
        placeholderType === SlidesApp.PlaceholderType.CENTERED_TITLE) {
      shape.getText().setText(data.title || '');
    } else if (placeholderType === SlidesApp.PlaceholderType.SUBTITLE) {
      const subtitle = data.date ? `提案日: ${data.date}` : '';
      shape.getText().setText(subtitle);
    }
  });

  // 背景色を設定
  slide.getBackground().setSolidFill('#1a73e8');
}

/**
 * セクションスライド（章扉）
 */
function createSectionSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.SECTION_HEADER);
  const shapes = slide.getShapes();

  const sectionText = data.sectionNo ? `${data.sectionNo}. ${data.title}` : data.title;

  shapes.forEach(shape => {
    const placeholderType = shape.getPlaceholderType();
    if (placeholderType === SlidesApp.PlaceholderType.TITLE) {
      shape.getText().setText(sectionText || '');
    }
  });

  slide.getBackground().setSolidFill('#e8f0fe');
}

/**
 * アジェンダスライド
 */
function createAgendaSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // タイトル
  const titleShape = slide.getShapes()[0];
  titleShape.getText().setText(data.title || 'アジェンダ');

  // 本文を生成
  let bodyText = '';

  // sectionsフィールドがある場合（Gemini生成の新形式）
  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach(section => {
      // セクション見出し
      if (section.heading) {
        bodyText += `【${removeMarkdown(section.heading)}】\n`;
      }
      // セクションのコンテンツ
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach(item => {
          bodyText += `${removeMarkdown(item)}\n`;
        });
      }
      bodyText += '\n';
    });
  }
  // 旧形式（itemsフィールド）にも対応
  else {
    const items = data.items || [];
    items.forEach((item, index) => {
      bodyText += `${index + 1}. ${removeMarkdown(item)}\n`;
    });
  }

  const bodyShape = slide.getShapes()[1];
  bodyShape.getText().setText(bodyText);
}

/**
 * コンテンツスライド
 */
function createContentSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // タイトル
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  // 本文を生成
  let bodyText = '';

  // sectionsフィールドがある場合（Gemini生成の新形式）
  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach(section => {
      // セクション見出し
      if (section.heading) {
        bodyText += `【${removeMarkdown(section.heading)}】\n`;
      }
      // セクションのコンテンツ
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach(item => {
          bodyText += `• ${removeMarkdown(item)}\n`;
        });
      }
      bodyText += '\n';
    });
  }
  // 旧形式（pointsフィールド）にも対応
  else {
    if (data.subhead) {
      bodyText += `${removeMarkdown(data.subhead)}\n\n`;
    }
    const points = data.points || [];
    points.forEach(point => {
      bodyText += `• ${removeMarkdown(point)}\n`;
    });
  }

  shapes[1].getText().setText(bodyText);
}

/**
 * 比較スライド
 */
function createCompareSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);

  // タイトル
  const titleShape = slide.getShapes()[0];
  titleShape.getText().setText(data.title || '');

  // 2カラムのテキストボックスを作成
  const leftTitle = data.leftTitle || '左';
  const rightTitle = data.rightTitle || '右';
  const leftItems = data.leftItems || [];
  const rightItems = data.rightItems || [];

  // 左側
  let leftText = `【${leftTitle}】\n`;
  leftItems.forEach(item => {
    leftText += `• ${removeMarkdown(item)}\n`;
  });

  const leftBox = slide.insertTextBox(leftText, 30, 120, 300, 300);
  leftBox.getFill().setSolidFill('#e8f5e9');

  // 右側
  let rightText = `【${rightTitle}】\n`;
  rightItems.forEach(item => {
    rightText += `• ${removeMarkdown(item)}\n`;
  });

  const rightBox = slide.insertTextBox(rightText, 370, 120, 300, 300);
  rightBox.getFill().setSolidFill('#fce4ec');
}

/**
 * プロセススライド
 */
function createProcessSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // タイトル
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  // ステップ
  const steps = data.steps || [];
  let bodyText = '';
  steps.forEach((step, index) => {
    bodyText += `ステップ ${index + 1}: ${removeMarkdown(step)}\n`;
  });

  shapes[1].getText().setText(bodyText);
}

/**
 * ヘッダーカードスライド
 */
function createHeaderCardsSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);

  // タイトル
  const titleShape = slide.getShapes()[0];
  titleShape.getText().setText(data.title || '');

  // カード
  const items = data.items || [];
  const cardWidth = 200;
  const cardHeight = 150;
  const startX = 50;
  const startY = 120;
  const gap = 20;

  items.forEach((item, index) => {
    const x = startX + (index % 3) * (cardWidth + gap);
    const y = startY + Math.floor(index / 3) * (cardHeight + gap);

    const cardTitle = typeof item === 'string' ? item : item.title;
    const cardDesc = typeof item === 'object' ? item.desc : '';

    const cardText = `${cardTitle}\n${cardDesc}`;
    const card = slide.insertTextBox(cardText, x, y, cardWidth, cardHeight);
    card.getFill().setSolidFill('#f5f5f5');
    card.getBorder().setLineFill('#1a73e8');
  });
}

/**
 * 箇条書きカードスライド
 */
function createBulletCardsSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // タイトル
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  // アイテム
  const items = data.items || [];
  let bodyText = '';
  items.forEach((item, index) => {
    const itemTitle = item.title || '';
    const itemDesc = item.desc || '';
    bodyText += `${index + 1}. ${removeMarkdown(itemTitle)}\n   ${removeMarkdown(itemDesc)}\n\n`;
  });

  shapes[1].getText().setText(bodyText);
}

/**
 * KPIスライド
 */
function createKpiSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);

  // タイトル
  const titleShape = slide.getShapes()[0];
  titleShape.getText().setText(data.title || '');

  // KPI項目
  const items = data.items || [];
  const cardWidth = 150;
  const cardHeight = 100;
  const startX = 50;
  const startY = 120;
  const gap = 20;

  items.forEach((item, index) => {
    const x = startX + (index % 4) * (cardWidth + gap);
    const y = startY + Math.floor(index / 4) * (cardHeight + gap);

    const kpiText = `${item.label}\n${item.value}\n${item.change}`;
    const card = slide.insertTextBox(kpiText, x, y, cardWidth, cardHeight);

    // ステータスに応じた色
    const bgColor = item.status === 'good' ? '#e8f5e9' :
                    item.status === 'bad' ? '#ffebee' : '#f5f5f5';
    card.getFill().setSolidFill(bgColor);
  });
}

/**
 * 数値比較スライド
 */
function createStatsCompareSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // タイトル
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  // 統計データ
  const stats = data.stats || [];
  let bodyText = '';
  stats.forEach(stat => {
    bodyText += `${stat.label}: ${stat.leftValue} → ${stat.rightValue}\n`;
  });

  shapes[1].getText().setText(bodyText);
}

/**
 * クロージングスライド
 */
function createClosingSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  const shapes = slide.getShapes();

  shapes.forEach(shape => {
    const placeholderType = shape.getPlaceholderType();
    if (placeholderType === SlidesApp.PlaceholderType.TITLE ||
        placeholderType === SlidesApp.PlaceholderType.CENTERED_TITLE) {
      shape.getText().setText('ご清聴ありがとうございました');
    }
  });

  slide.getBackground().setSolidFill('#1a73e8');
}

/**
 * デフォルトスライド（未対応のタイプ用）
 */
function createDefaultSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || 'タイトル');

  let bodyText = JSON.stringify(data, null, 2);
  shapes[1].getText().setText(bodyText.substring(0, 500));
}

/**
 * Markdown記法を除去
 */
function removeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **太字**
    .replace(/\[\[(.*?)\]\]/g, '$1')  // [[強調語]]
    .replace(/\*(.*?)\*/g, '$1')      // *イタリック*
    .replace(/`(.*?)`/g, '$1');       // `コード`
}
