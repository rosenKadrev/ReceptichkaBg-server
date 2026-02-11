const messages = {
    // Auth messages
    'auth.login.success': 'Успешно влизане в системата.',
    'auth.login.invalid': 'Невалиден имейл или парола.',
    'auth.login.error': 'Грешка при влизане в системата.',
    'auth.signup.success': 'Регистрацията е успешна.',
    'auth.signup.email_exists': 'Този имейл вече е регистриран.',
    'auth.signup.error': 'Грешка при регистрация на потребителя.',

    // Password reset messages
    'password.forgot.success': 'Ако съществува акаунт с този имейл, инструкции за възстановяване на паролата са изпратени на него.',
    'password.forgot.error': 'Грешка при заявка за нулиране на паролата.',
    'password.reset.success': 'Паролата е успешно нулирана. Можете да влезете с новата си парола.',
    'password.reset.error': 'Грешка при нулиране на паролата.',
    'password.reset.invalid_token': 'Невалиден или изтекъл токен за нулиране.',

    // User messages
    'user.update.success': 'Профилът е успешно обновен.',
    'user.update.email_exists': 'Този имейл вече се използва от друг акаунт.',
    'user.delete.success': 'Потребителят е успешно изтрит.',
    'user.promote.success': 'Потребителят е успешно повишен до администратор.',
    'user.demote.success': 'Администраторът е успешно понижен до потребител.',
    'user.not_found': 'Потребителят не е намерен.',
    'user.fetch.success': 'Потребителите са успешно заредени.',
    'user.update.avatar_upload_error': 'Грешка при качване на аватар.',
    'user.demote.not_found': 'Администраторът не е намерен или вече е обикновен потребител.',
    'user.promote.not_found': 'Потребителят не е намерен или вече е администратор.',
    'user.delete.error': 'Грешка при изтриване на потребителя.',
    'user.demote.error': 'Грешка при понижаване на администратора.',
    'user.promote.error': 'Грешка при повишаване на потребителя.',
    'user.fetch.error': 'Грешка при зареждане на потребителите.',
    'user.update.error': 'Грешка при обновяване на профила.',

    // Access messages
    'access.denied': 'Достъпът е отказан.',
    'access.admin_only': 'Само администратори имат достъп.',
    'access.super_admin_only': 'Само главни администратори имат достъп.',
    'access.cannot_delete': 'Нямате право да изтриете този потребител.',
    'access.unauthorized': 'Не сте оторизиран.',
    'access.token_invalid': 'Невалиден токен.',
    'access.token_expired': 'Токенът е изтекъл.',

    // Validation messages
    'validation.email.required': 'Имейлът е задължителен.',
    'validation.email.invalid': 'Моля, въведете валиден имейл адрес.',
    'validation.password.required': 'Паролата е задължителна.',
    'validation.password.min': 'Паролата трябва да бъде поне 6 символа.',
    'validation.password.max': 'Паролата не може да бъде повече от 20 символа.',
    'validation.name.required': 'Името е задължително.',
    'validation.token.required': 'Токенът е задължителен.',
    'validation.no_fields': 'Не са предоставени полета за обновяване.',

    // Article messages
    'article.category.not_found': 'Категорията на статията не е намерена.',
    'article.categories.fetch.success': 'Категориите статии са успешно заредени.',
    'article.categories.fetch.error': 'Грешка при зареждане на категориите статии.',
    'article.articles.fetch.success': 'Статиите са успешно заредени.',
    'article.articles.fetch.error': 'Грешка при зареждане на статиите.',
    'article.details.fetch.success': 'Детайлите на статията са успешно заредени.',
    'article.details.fetch.error': 'Грешка при зареждане на детайлите на статията.',
    'article.not_found': 'Статията не е намерена.',
    'article.admin.access_denied': 'Достъпът е отказан. Само за администратори.',
    'article.create.success': 'Статията е създадена успешно.',
    'article.create.error': 'Грешка при създаване на статията.',
    'article.create.rollback_error': 'Грешка при отмяна на транзакцията.',
    'article.validation.name_required': 'Името на статията е задължително.',
    'article.validation.description_required': 'Описанието на статията е задължително.',
    'article.validation.category_required': 'Категорията на статията е задължителна.',
    'article.validation.paragraphs_required': 'Параграфите са задължителни.',
    'article.validation.paragraphs_empty': 'Трябва да има поне един параграф.',
    'article.delete.success': 'Статията е изтрита успешно.',
    'article.delete.error': 'Грешка при изтриване на статията.',
    'article.delete.not_found': 'Статията не е намерена.',
    'article.delete.rollback_error': 'Грешка при отмяна на транзакцията.',
    'article.update.success': 'Статията е актуализирана успешно.',
    'article.update.error': 'Грешка при актуализиране на статията.',
    'article.update.rollback_error': 'Грешка при отмяна на транзакцията при актуализация.',

    // Recipe messages
    'recipe.lookups.fetch.success': 'Справочниците за рецепти са успешно заредени.',
    'recipe.lookups.fetch.error': 'Грешка при зареждане на справочниците за рецепти.',
    'recipe.create.success': 'Рецептата е създадена успешно.',
    'recipe.create.error': 'Грешка при създаване на рецептата.',
    'recipe.create.rollback_error': 'Грешка при отмяна на транзакцията.',
    'recipe.my.fetch.success': 'Моите рецепти са успешно заредени.',
    'recipe.my.fetch.error': 'Грешка при зареждане на моите рецепти.',
    'recipe.all.fetch.success': 'Всички рецепти са успешно заредени.',
    'recipe.all.fetch.error': 'Грешка при зареждане на всички рецепти.',
    'recipe.delete.success': 'Рецептата е изтрита успешно.',
    'recipe.delete.error': 'Грешка при изтриване на рецептата.',
    'recipe.delete.not_found': 'Рецептата не е намерена или не е ваша.',
    'recipe.admin.delete.success': 'Рецептата е изтрита успешно от администратор.',
    'recipe.admin.delete.error': 'Грешка при изтриване на рецептата от администратор.',
    'recipe.admin.delete.not_found': 'Рецептата не е намерена.',
    'recipe.admin.access_denied': 'Достъпът е отказан. Само за администратори.',
    'recipe.my.byId.success': 'Рецептата е успешно заредена.',
    'recipe.my.byId.error': 'Грешка при зареждане на рецептата.',
    'recipe.my.byId.not_found': 'Рецептата не е намерена.',
    'recipe.my.byId.access_denied': 'Достъпът е отказан. Рецептата не е ваша.',
    'recipe.byId.success': 'Рецептата е успешно заредена.',
    'recipe.byId.error': 'Грешка при зареждане на рецептата.',
    'recipe.byId.not_found': 'Рецептата не е намерена или не е одобрена.',
    'recipe.update.success': 'Рецептата е актуализирана успешно.',
    'recipe.update.error': 'Грешка при актуализиране на рецептата.',
    'recipe.update.not_found': 'Рецептата не е намерена или нямате права за редактиране.',
    'recipe.update.rollback_error': 'Грешка при отмяна на транзакцията.',
    'recipe.random.fetch.success': 'Случайните рецепти са успешно заредени.',
    'recipe.random.fetch.error': 'Грешка при зареждане на случайни рецепти.',
    'recipe.admin.fetch.success': 'Административните рецепти са успешно заредени.',
    'recipe.admin.fetch.error': 'Грешка при зареждане на административните рецепти.',
    'recipe.approve.success': 'Рецептата е одобрена успешно.',
    'recipe.approve.error': 'Грешка при одобряване на рецептата.',
    'recipe.approve.not_found': 'Рецептата не е намерена.',
    'recipe.reject.success': 'Рецептата е отхвърлена успешно.',
    'recipe.reject.error': 'Грешка при отхвърляне на рецептата.',
    'recipe.reject.not_found': 'Рецептата не е намерена.',

    // Rating messages
    'rating.add.success': 'Оценката е добавена успешно.',
    'rating.add.error': 'Грешка при добавяне на оценка.',
    'rating.update.success': 'Оценката е актуализирана успешно.',
    'rating.recipe_not_found': 'Рецептата не е намерена.',
    'rating.recipe_not_approved': 'Не можете да оценявате рецепти, които не са одобрени.',
    'rating.own_recipe': 'Не можете да оценявате собствена рецепта.',
    'rating.invalid_value': 'Оценката трябва да бъде между 1 и 5.',
    'rating.required': 'Оценката е задължителна.',

    // Favorite messages
    'favorite.fetch.success': 'Любимите рецепти са успешно заредени.',
    'favorite.fetch.error': 'Грешка при зареждане на любимите рецепти.',
    'favorite.add.success': 'Рецептата е добавена към любими успешно.',
    'favorite.add.error': 'Грешка при добавяне на рецептата към любими.',
    'favorite.remove.success': 'Рецептата е премахната от любими успешно.',
    'favorite.remove.error': 'Грешка при премахване на рецептата от любими.',
    'favorite.already_exists': 'Тази рецепта вече е в любимите ви.',
    'favorite.not_found': 'Рецептата не е намерена в любимите ви.',
    'favorite.recipe_not_found': 'Рецептата не е намерена.',
    'favorite.recipe_not_active': 'Не можете да добавяте рецепти, които не са активни към любими.',
    'favorite.recipes.fetch.success': 'Любимите рецепти са успешно заредени.',
    'favorite.recipes.fetch.error': 'Грешка при зареждане на любимите рецепти.',

    // Generic error messages
    'error.server': 'Възникна грешка на сървъра.',
};

const t = (key, params = {}) => {
    let message = messages[key] || key;

    Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
    });

    return message;
};

module.exports = { t, messages };