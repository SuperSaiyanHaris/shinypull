import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Youtube, Twitch } from 'lucide-react';
import KickIcon from './KickIcon';
import TikTokIcon from './TikTokIcon';
import BlueskyIcon from './BlueskyIcon';
import { getCategoryTheme } from '../lib/blogTheme';

const PLATFORM_META = {
  youtube: { Icon: Youtube,    color: 'text-red-400',    bg: 'bg-red-950/40',    border: 'border-red-800/50'    },
  twitch:  { Icon: Twitch,     color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/50' },
  tiktok:  { Icon: TikTokIcon, color: 'text-pink-400',   bg: 'bg-pink-950/40',   border: 'border-pink-800/50'   },
  kick:    { Icon: KickIcon,   color: 'text-green-400',  bg: 'bg-green-950/40',  border: 'border-green-800/50'  },
  bluesky: { Icon: BlueskyIcon,color: 'text-sky-400',    bg: 'bg-sky-950/40',    border: 'border-sky-800/50'    },
};

function CreatorMentions({ creators }) {
  if (!creators.length) return null;
  return (
    <div className="mt-10 pt-8 border-t border-gray-800">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Creators in this post</p>
      <div className="flex flex-wrap gap-2">
        {creators.map(({ platform, username, displayName }) => {
          const meta = PLATFORM_META[platform];
          if (!meta) return null;
          const { Icon, color, bg, border } = meta;
          return (
            <Link
              key={`${platform}/${username}`}
              to={`/${platform}/${username}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${bg} border ${border} rounded-full hover:brightness-125 transition-all text-sm font-medium ${color}`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {displayName || username}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const CALLOUT_STYLES = {
  stat:    { bg: 'bg-purple-950/40',  border: 'border-purple-500/40',  label: 'By the Numbers',  labelColor: 'text-purple-400'  },
  insight: { bg: 'bg-indigo-950/40',  border: 'border-indigo-500/40',  label: 'Key Insight',     labelColor: 'text-indigo-400'  },
  tip:     { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', label: 'Pro Tip',         labelColor: 'text-emerald-400' },
  update:  { bg: 'bg-amber-950/40',   border: 'border-amber-500/40',   label: 'Platform Update', labelColor: 'text-amber-400'   },
  warning: { bg: 'bg-red-950/40',     border: 'border-red-500/40',     label: 'Watch Out',       labelColor: 'text-red-400'     },
};

function CalloutBox({ type, children }) {
  const s = CALLOUT_STYLES[type] || CALLOUT_STYLES.insight;
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl px-6 py-5 my-8`}>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${s.labelColor} mb-3`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.labelColor.replace('text-', 'bg-')}`} />
        {s.label}
      </div>
      <div className="text-gray-200 leading-relaxed">{children}</div>
    </div>
  );
}

function TldrBox({ children, theme }) {
  return (
    <div className={`relative my-10 rounded-2xl bg-gradient-to-br ${theme.intro}`}>
      <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 ${theme.glow} rounded-full blur-3xl`} />
      <div className="relative px-6 py-5 sm:px-8 sm:py-6">
        <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full ${theme.pill} text-xs font-bold uppercase tracking-widest`}>
          The Quick Read
        </div>
        <div className="text-gray-200 [&_ul]:list-none [&_ul]:ml-0 [&_li]:relative [&_li]:pl-6 [&_li]:mb-2 [&_li:before]:content-['→'] [&_li:before]:absolute [&_li:before]:left-0 [&_li:before]:text-indigo-400 [&_li:before]:font-bold [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatsStrip({ raw, theme }) {
  const items = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split('|');
      return { value: (value || '').trim(), label: rest.join('|').trim() };
    })
    .filter((s) => s.value);

  if (items.length === 0) return null;
  const cols = items.length === 4 ? 'sm:grid-cols-4' : items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  const gradientStops = theme.h2Bar.replace('bg-gradient-to-r ', '');

  return (
    <div className={`grid grid-cols-1 ${cols} gap-3 sm:gap-4 my-10`}>
      {items.map((item, i) => (
        <div key={i} className="relative group bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 hover:border-gray-700 transition-colors">
          <div className={`pointer-events-none absolute -top-6 -right-6 w-20 h-20 ${theme.glow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
          <div className="relative">
            <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-br ${gradientStops} bg-clip-text text-transparent leading-none`}>
              {item.value}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-gray-400 font-medium leading-snug">
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildMarkdownComponents(theme) {
  return {
    h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-100 mt-8 mb-6">{children}</h1>,
    h2: ({ children }) => (
      <div className="relative mt-12 sm:mt-16 mb-5 sm:mb-8 first:mt-0">
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 sm:w-12 h-1 ${theme.h2Bar} rounded-full`} />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 pl-12 sm:pl-16 leading-tight">{children}</h2>
      </div>
    ),
    h3: ({ children }) => <h3 className="text-lg sm:text-xl font-bold text-gray-100 mt-8 mb-3">{children}</h3>,
    p: ({ children, node }) => {
      const isFirst = node?.position?.start?.line === 1;
      if (isFirst) {
        return (
          <div className="relative mb-8 sm:mb-12">
            <div className={`pointer-events-none absolute -top-8 -left-8 w-32 h-32 ${theme.glow} rounded-full blur-3xl`} />
            <p className={`relative text-base sm:text-lg text-gray-100 leading-relaxed font-medium p-5 sm:p-7 bg-gradient-to-br ${theme.intro} rounded-2xl border`}>
              {children}
            </p>
          </div>
        );
      }
      return <p className="text-gray-300 leading-relaxed mb-5 text-[15px] sm:text-base">{children}</p>;
    },
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http');
      if (isExternal) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">{children}</a>;
      }
      return <Link to={href} className="text-indigo-400 hover:text-indigo-300 underline font-medium">{children}</Link>;
    },
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="text-gray-200">{children}</em>,
    ul: ({ children }) => <ul className="my-5 text-gray-300 list-disc ml-5 md:ml-6 space-y-1.5">{children}</ul>,
    ol: ({ children }) => <ol className="my-5 text-gray-300 list-decimal ml-5 md:ml-6 space-y-1.5">{children}</ol>,
    li: ({ children }) => <li className="text-gray-300 leading-relaxed">{children}</li>,
    hr: () => (
      <div className="my-12 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="block h-px w-12 bg-gray-700" />
        <span className="block w-1.5 h-1.5 rounded-full bg-gray-600" />
        <span className="block w-1.5 h-1.5 rounded-full bg-gray-700" />
        <span className="block w-1.5 h-1.5 rounded-full bg-gray-600" />
        <span className="block h-px w-12 bg-gray-700" />
      </div>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-xl border border-gray-800 shadow-lg">
        <table className="min-w-full divide-y divide-gray-800">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-800/80 backdrop-blur">{children}</thead>,
    tbody: ({ children }) => <tbody className="bg-gray-900/40 divide-y divide-gray-800">{children}</tbody>,
    tr: ({ children, isHeader }) => <tr className={isHeader ? '' : 'even:bg-gray-800/30 hover:bg-gray-800/60 transition-colors'}>{children}</tr>,
    th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{children}</th>,
    td: ({ children }) => <td className="px-4 py-3 text-sm text-gray-300">{children}</td>,
    code: ({ inline, children }) => {
      if (inline) {
        return <code className="px-1.5 py-0.5 bg-gray-800 rounded text-sm font-mono text-indigo-400">{children}</code>;
      }
      return (
        <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 border border-gray-800">
          <code className="text-sm font-mono">{children}</code>
        </pre>
      );
    },
    blockquote: ({ children }) => (
      <blockquote className="relative my-10 px-6 py-4 sm:px-8 sm:py-5">
        <span className="absolute top-0 left-0 text-6xl leading-none text-gray-700 font-serif select-none">&ldquo;</span>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.h2Bar} rounded-full`} />
        <div className="relative pl-4 text-lg sm:text-xl text-gray-200 italic font-medium leading-relaxed">{children}</div>
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <figure className="my-10">
        <img src={src} alt={alt || ''} loading="lazy" className="w-full rounded-xl object-cover max-h-[440px] border border-gray-800 shadow-xl" />
        {alt && <figcaption className="mt-3 text-center text-xs text-gray-500 italic">{alt}</figcaption>}
      </figure>
    ),
  };
}

function buildInlineMarkdownComponents(base) {
  return {
    ...base,
    p: ({ children }) => <p className="text-gray-200 leading-relaxed mb-2 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
    ul: ({ children }) => <ul className="my-2">{children}</ul>,
    li: ({ children }) => <li className="text-gray-200 leading-relaxed">{children}</li>,
  };
}

export default function BlogContent({ content, category }) {
  if (!content) return null;
  const theme = getCategoryTheme(category);
  const markdownComponents = buildMarkdownComponents(theme);
  const inlineComponents = buildInlineMarkdownComponents(markdownComponents);

  const creatorsTagMatch = content.match(/\{\{creators:([^}]+)\}\}/);
  const mentionedCreators = creatorsTagMatch
    ? creatorsTagMatch[1]
        .split(',')
        .map((entry) => {
          const [platformUser, displayName] = entry.trim().split(':');
          const [platform, username] = (platformUser || '').split('/');
          return { platform, username, displayName: displayName || username };
        })
        .filter((c) => c.platform && c.username)
    : [];
  let cleanedContent = content.replace(/\{\{creators:[^}]+\}\}\n?/g, '');

  cleanedContent = cleanedContent
    .replace(/\{\{product(?:-mini)?:[^}]+\}\}\n?/g, '')
    .replace(/\{\{product-grid\}\}\n?/g, '')
    .replace(/\{\{\/product-grid\}\}\n?/g, '');

  const statsBlocks = [];
  cleanedContent = cleanedContent.replace(/\{\{stats\}\}([\s\S]*?)\{\{\/stats\}\}/g, (_, raw) => {
    const idx = statsBlocks.length;
    statsBlocks.push(raw.trim());
    return `\n{{__stats_${idx}__}}\n`;
  });

  const parts = cleanedContent.split(
    /(\{\{callout:[^}]+\}\}|\{\{\/callout\}\}|\{\{tldr\}\}|\{\{\/tldr\}\}|\{\{__stats_\d+__\}\})/g
  );

  let inCallout = false;
  let calloutType = 'insight';
  let inTldr = false;
  let tldrContent = '';
  const elements = [];

  parts.forEach((part, index) => {
    if (part === '{{tldr}}') {
      inTldr = true;
      tldrContent = '';
      return;
    }
    if (part === '{{/tldr}}') {
      elements.push(
        <TldrBox key={`tldr-${index}`} theme={theme}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
            {tldrContent.trim()}
          </ReactMarkdown>
        </TldrBox>
      );
      inTldr = false;
      tldrContent = '';
      return;
    }

    const statsToken = part.match(/^\{\{__stats_(\d+)__\}\}$/);
    if (statsToken) {
      const raw = statsBlocks[Number(statsToken[1])];
      if (raw) {
        elements.push(<StatsStrip key={`stats-${index}`} raw={raw} theme={theme} />);
      }
      return;
    }

    const calloutOpenMatch = part.match(/\{\{callout:([^}]+)\}\}/);
    if (calloutOpenMatch) {
      inCallout = true;
      calloutType = calloutOpenMatch[1];
      return;
    }
    if (part === '{{/callout}}') {
      inCallout = false;
      return;
    }

    if (inTldr) {
      tldrContent += part;
      return;
    }

    if (part.trim()) {
      const mdContent = (
        <ReactMarkdown
          key={`content-${index}`}
          remarkPlugins={[remarkGfm]}
          components={inCallout ? inlineComponents : markdownComponents}
        >
          {part}
        </ReactMarkdown>
      );
      if (inCallout) {
        elements.push(
          <CalloutBox key={`callout-${index}`} type={calloutType}>
            {mdContent}
          </CalloutBox>
        );
      } else {
        elements.push(mdContent);
      }
    }
  });

  return (
    <div className="prose prose-lg max-w-none">
      {elements}
      <CreatorMentions creators={mentionedCreators} />
    </div>
  );
}
