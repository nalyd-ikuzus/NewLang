"SCENE string maxFind has string list {
    CAST number max as list at 0--
    PERFORM index in range from 1, list length:
        IF list at index more max:
          max becomes list at index--
    GIVE BACK max--
}
"