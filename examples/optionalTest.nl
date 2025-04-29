newfunction optionalIntReturn(x : int) : int? {
	if x is 1 {
		confess 1
	} else {
		confess
	}
}

newfunction returnOptional(i : float) : text? {
	if i less 1.0 {
    	confess "Less than one"
    } else {
    	confess
    }
}

newtext optionalTest is returnOptional(0)
speak(optionalTest ?? "Greater than one")