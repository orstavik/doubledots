const cursors = /^(auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out)$/;

export function cursor(start, [first]) {
  first = first?.args[0];
  if (typeof first === 'string')
    return { cursor: `url(${first})` };
  if (first?.match(cursors))
    return { cursor: first };
  throw new Error('$cursor_name/"url" requires a single argument');
}
