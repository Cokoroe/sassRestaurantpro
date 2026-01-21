// src/main/java/com/sassfnb/application/service/MenuOptionService.java
package com.sassfnb.application.service;

import com.sassfnb.adapters.rest.dto.menu.MenuDtos.*;

import java.util.List;
import java.util.UUID;

public interface MenuOptionService {

    // OPTIONS
    List<OptionResponse> listOptionsByItem(UUID itemId);

    OptionResponse addOption(UUID itemId, OptionCreateRequest req);

    OptionResponse updateOption(UUID optionId, OptionUpdateRequest req);

    void deleteOption(UUID optionId);

    // OPTION VALUES
    List<OptionValueResponse> listValues(UUID optionId);

    OptionValueResponse addValue(UUID optionId, OptionValueCreateRequest req);

    OptionValueResponse updateValue(UUID valueId, OptionValueUpdateRequest req);

    void deleteValue(UUID valueId);
}
