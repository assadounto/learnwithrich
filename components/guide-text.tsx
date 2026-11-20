'use client';
import {RichMarkdown} from './rich-markdown';

export function GuideText({text, adminPreview = true}: {text: string; adminPreview?: boolean}) {
  return <RichMarkdown text={text} className="guide-rich-text" adminPreview={adminPreview}/>;
}
