newfunction listplus (list : float[], i : float) : float {
    if i is 0 {
        confess 0
    }
    confess list[i] + listplus(list, i minus 1)
}