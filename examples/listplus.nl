newfunction listplus (list : float[], i : int) : float {
    if i is 0 {
        confess list[i]
    }
    confess (list[i] plus listplus(list, i minus 1))
}
speak(listplus([1.0, 2.0, 3.0, 4.0, 5.0], 4))