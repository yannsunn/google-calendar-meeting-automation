/**
 * DX提案スライド自動生成システム
 * N8Nからのリクエストを受け取り、Googleスライドを生成
 */

// Webアプリのエンドポイント（POST リクエスト）
function doPost(e) {
  try {
    const requestBody = e.postData.contents;
    const data = JSON.parse(requestBody);

    const slideData = data.slideData || [];
    const companyName = data.companyName || '企業名不明';
    const presentationTitle = data.presentationTitle || `${companyName} 様 DX推進提案`;

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
        Logger.log(`Error creating slide ${index}: ${error}`);
      }
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      presentationId: presentationId,
      slideUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      slideCount: slideCount,
      message: 'Slides generated successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doPost: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: 'Failed to generate slides'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    message: 'DX Proposal Slide Generator API is running',
    version: '2.0.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

function createSlideFromData(presentation, slideObj, index) {
  const type = slideObj.type;

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
    case 'proposal':  // proposalタイプもcontentと同様に処理
      createContentSlide(presentation, slideObj);
      break;
    case 'compare':
      createCompareSlide(presentation, slideObj);
      break;
    case 'process':
    case 'processList':
      createProcessSlide(presentation, slideObj);
      break;
    case 'closing':
      createClosingSlide(presentation, slideObj);
      break;
    default:
      createDefaultSlide(presentation, slideObj);
  }
}

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

  slide.getBackground().setSolidFill('#1a73e8');
}

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

function createAgendaSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || 'アジェンダ');

  let bodyText = '';

  // mainContentフィールド (Gemini最新形式)
  if (data.mainContent && Array.isArray(data.mainContent)) {
    data.mainContent.forEach((item, index) => {
      bodyText += `${removeMarkdown(item)}\n`;
    });
  }
  // itemsフィールド
  else if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      bodyText += `${index + 1}. ${removeMarkdown(item)}\n`;
    });
  }
  // sectionsフィールド
  else if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach(section => {
      if (section.heading) {
        bodyText += `【${removeMarkdown(section.heading)}】\n`;
      }
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach(item => {
          bodyText += `${removeMarkdown(item)}\n`;
        });
      }
      bodyText += '\n';
    });
  }

  shapes[1].getText().setText(bodyText);
}

function createContentSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  let bodyText = '';

  // mainContentフィールド (Gemini最新形式 - 文字列配列)
  if (data.mainContent && Array.isArray(data.mainContent)) {
    data.mainContent.forEach(item => {
      bodyText += `• ${removeMarkdown(item)}\n`;
    });
  }
  // contentフィールド (構造化オブジェクト配列)
  else if (data.content && Array.isArray(data.content)) {
    data.content.forEach(block => {
      if (block.type === 'paragraph' && block.text) {
        bodyText += `${removeMarkdown(block.text)}\n\n`;
      }
      else if (block.type === 'heading' && block.text) {
        bodyText += `【${removeMarkdown(block.text)}】\n`;
      }
      else if (block.type === 'list' && block.items && Array.isArray(block.items)) {
        block.items.forEach(item => {
          bodyText += `• ${removeMarkdown(item)}\n`;
        });
        bodyText += '\n';
      }
      else if (typeof block === 'string') {
        bodyText += `• ${removeMarkdown(block)}\n`;
      }
    });
  }
  // sectionsフィールド
  else if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach(section => {
      if (section.heading) {
        bodyText += `【${removeMarkdown(section.heading)}】\n`;
      }
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach(item => {
          bodyText += `• ${removeMarkdown(item)}\n`;
        });
      }
      bodyText += '\n';
    });
  }
  // pointsフィールド
  else if (data.points && Array.isArray(data.points)) {
    if (data.subhead) {
      bodyText += `${removeMarkdown(data.subhead)}\n\n`;
    }
    data.points.forEach(point => {
      bodyText += `• ${removeMarkdown(point)}\n`;
    });
  }

  shapes[1].getText().setText(bodyText);
}

function createCompareSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);
  const titleShape = slide.getShapes()[0];
  titleShape.getText().setText(data.title || '');

  const leftTitle = data.leftTitle || '左';
  const rightTitle = data.rightTitle || '右';
  const leftItems = data.leftItems || [];
  const rightItems = data.rightItems || [];

  let leftText = `【${leftTitle}】\n`;
  leftItems.forEach(item => {
    leftText += `• ${removeMarkdown(item)}\n`;
  });

  const leftBox = slide.insertTextBox(leftText, 30, 120, 300, 300);
  leftBox.getFill().setSolidFill('#e8f5e9');

  let rightText = `【${rightTitle}】\n`;
  rightItems.forEach(item => {
    rightText += `• ${removeMarkdown(item)}\n`;
  });

  const rightBox = slide.insertTextBox(rightText, 370, 120, 300, 300);
  rightBox.getFill().setSolidFill('#fce4ec');
}

function createProcessSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || '');

  const steps = data.steps || [];
  let bodyText = '';
  steps.forEach((step, index) => {
    bodyText += `ステップ ${index + 1}: ${removeMarkdown(step)}\n`;
  });

  shapes[1].getText().setText(bodyText);
}

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

function createDefaultSlide(presentation, data) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  const shapes = slide.getShapes();
  shapes[0].getText().setText(data.title || 'タイトル');

  let bodyText = JSON.stringify(data, null, 2);
  shapes[1].getText().setText(bodyText.substring(0, 500));
}

function removeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **太字**
    .replace(/\[\[(.*?)\]\]/g, '$1')  // [[強調語]]
    .replace(/\*(.*?)\*/g, '$1')      // *イタリック*
    .replace(/`(.*?)`/g, '$1');       // `コード`
}
