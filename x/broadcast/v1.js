const PREFIX = "doubledots-250606-";
export function broadcast_(rule) {
  const name = PREFIX + (rule.split("_")[1] || "");
  return function broadcast_name(input) {
    return (this.__broadcast ??= new BroadcastChannel(name)).postMessage(input), input;
  };
}

export function Broadcast_(rule) {
  const name = PREFIX + (rule.split("_")[1] || "");

  return class Broadcast_name extends AttrCustom {
    upgrade() {
      this.__broadcast ??= new BroadcastChannel(name);
      this.__broadcast.addEventListener("message", this.__listener = this.onmessage.bind(this));
    }

    onmessage({ data }) {
      this.dispatchEvent(Object.assign(new Event("broadcast"), { [Event.data]: data }))
    }

    remove() {
      this.__broadcast.removeEventListener("message", this.__listener);
      this.__broadcast.close();
      super.remove();
    }
  }
}