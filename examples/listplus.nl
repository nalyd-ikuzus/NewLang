newfunction listplus (list, i) {
    if i is 0 {
        confess 0
    }
    confess list[i] + listplus(list, i - 1)
}