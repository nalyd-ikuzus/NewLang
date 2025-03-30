newfunction listspeak (list, i) {
    if i is 0 {
        confess
    }
    speak(list[i])
    confess listplus(list, i minus 1)
}