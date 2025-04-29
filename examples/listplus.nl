newfunction listplus (list : float[], i : int) : float {
    if i is 0 {
        confess list[i]
    }
    confess (list[i] plus listplus(list, i minus 1))
}