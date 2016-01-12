# -- encoding: UTF-8 --
import re
import sys, json, time


def read_messages(filenames):
    messages = set()
    user_map = {}
    for fn in sorted(filenames):
        with open(fn, "r") as infp:
            data = json.load(infp)
            for m in data["messages"]:
                messages.add((float(m["ts"]), m.get("username") or m.get("user"), m["text"]))
            user_map.update(data.get("userMap") or {})
    return (messages, user_map)


def format_messages(messages, user_map):
    user_name_map = dict((id, u["name"]) for (id, u) in user_map.items())

    for mtup in sorted(messages):
        ts = time.strftime("%Y-%m-%d %H:%M.%S", time.gmtime(mtup[0]))
        user = user_name_map.get(mtup[1], mtup[1])
        message = expand_message(mtup[2], user_name_map)
        yield "%s <%s> %s" % (ts, user, message)


def expand_message(message, user_name_map):
    message = re.sub(
        r"<@([A-Z0-9]+)>",
        lambda m: "@%s" % user_name_map[m.group(1)] if (m.group(1) in user_name_map) else m.group(0),
        message
    )
    message = message.replace("&gt;", ">")
    message = message.replace("\n", " | ")
    return message


if __name__ == "__main__":
    messages, user_map = read_messages(sys.argv[1:])
    for message in format_messages(messages, user_map):
        print(message)
