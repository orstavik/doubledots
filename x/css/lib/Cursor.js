const cursors = /^(auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out)$/;

export function cursor(start, args) {
  if(args.length === 1){
    const {word, quote} = args[0];
    if(word?.match(cursors))
      return {cursor: word};
    if(quote)
      return {cursor: `url(${quote})`};
  }
  throw new Error('$cursor_name/"url" requires a single argument');
}
