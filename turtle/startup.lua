os.loadAPI("json")
local ws = assert(http.websocket("ws://localhost:3292"))

while (true)
do
    local message = ws.receive()
    print(message)
    local obj = json.decode(message)
    if obj.type == 'eval' then
        print(obj['function'])
        local func = loadstring(obj['function'])
        print("> Eval " ..func())
    end

end
