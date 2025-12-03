package at.htl.dto;

import java.io.Serializable;

public record FilterDto(String filterType, String value, String start, String end)  {
}
