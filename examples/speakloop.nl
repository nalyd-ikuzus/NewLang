newfunction speakloop (i : int, end : int) : void{
    if i is end {
        confess
    } else {
        speak("BIG BROTHER")
        confess speakloop(i plus 1, end)
    }
}